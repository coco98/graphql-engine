{-# LANGUAGE DeriveLift        #-}
{-# LANGUAGE OverloadedStrings #-}
{-# LANGUAGE TemplateHaskell   #-}

module Hasura.RQL.Types.Subscribe
  ( CreateEventTriggerQuery(..)
  , SubscribeOpSpec(..)
  , SubscribeColumns(..)
  , TriggerName
  , TriggerId
  , Ops(..)
  , EventId
  , TriggerOpsDef(..)
  , EventTrigger(..)
  , EventTriggerDef(..)
  , RetryConf(..)
  , DeleteEventTriggerQuery(..)
  , DeliverEventQuery(..)
  -- , HeaderConf(..)
  -- , HeaderValue(..)
  -- , HeaderName
  , EventHeaderInfo(..)
  ) where

import           Data.Aeson
import           Data.Aeson.Casing
import           Data.Aeson.TH
import           Hasura.Prelude
import           Hasura.RQL.DDL.Headers
import           Hasura.SQL.Types
import           Language.Haskell.TH.Syntax (Lift)

import qualified Data.ByteString.Lazy       as LBS
import qualified Data.Text                  as T
import qualified Text.Regex.TDFA            as TDFA

type TriggerName = T.Text
type TriggerId   = T.Text
type EventId     = T.Text

data Ops = INSERT | UPDATE | DELETE deriving (Show)

data SubscribeColumns = SubCStar | SubCArray [PGCol] deriving (Show, Eq, Lift)

instance FromJSON SubscribeColumns where
  parseJSON (String s) = case s of
                          "*" -> return SubCStar
                          _   -> fail "only * or [] allowed"
  parseJSON v@(Array _) = SubCArray <$> parseJSON v
  parseJSON _ = fail "unexpected columns"

instance ToJSON SubscribeColumns where
  toJSON SubCStar         = "*"
  toJSON (SubCArray cols) = toJSON cols

data SubscribeOpSpec
  = SubscribeOpSpec
  { sosColumns :: !SubscribeColumns
  , sosPayload :: !(Maybe SubscribeColumns)
  } deriving (Show, Eq, Lift)

$(deriveJSON (aesonDrop 3 snakeCase){omitNothingFields=True} ''SubscribeOpSpec)

data RetryConf
  = RetryConf
  { rcNumRetries  :: !Int
  , rcIntervalSec :: !Int
  } deriving (Show, Eq, Lift)

$(deriveJSON (aesonDrop 2 snakeCase){omitNothingFields=True} ''RetryConf)

data EventHeaderInfo
  = EventHeaderInfo
  { ehiHeaderConf  :: !HeaderConf
  , ehiCachedValue :: !T.Text
  } deriving (Show, Eq, Lift)

$(deriveToJSON (aesonDrop 3 snakeCase){omitNothingFields=True} ''EventHeaderInfo)

data CreateEventTriggerQuery
  = CreateEventTriggerQuery
  { cetqName      :: !T.Text
  , cetqTable     :: !QualifiedTable
  , cetqInsert    :: !(Maybe SubscribeOpSpec)
  , cetqUpdate    :: !(Maybe SubscribeOpSpec)
  , cetqDelete    :: !(Maybe SubscribeOpSpec)
  , cetqRetryConf :: !(Maybe RetryConf)
  , cetqWebhook   :: !T.Text
  , cetqHeaders   :: !(Maybe [HeaderConf])
  , cetqReplace   :: !Bool
  } deriving (Show, Eq, Lift)

instance FromJSON CreateEventTriggerQuery where
  parseJSON (Object o) = do
    name      <- o .: "name"
    table     <- o .: "table"
    insert    <- o .:? "insert"
    update    <- o .:? "update"
    delete    <- o .:? "delete"
    retryConf <- o .:? "retry_conf"
    webhook   <- o .: "webhook"
    headers   <- o .:? "headers"
    replace   <- o .:? "replace" .!= False
    let regex = "^[A-Za-z]+[A-Za-z0-9_\\-]*$" :: LBS.ByteString
        compiledRegex = TDFA.makeRegex regex :: TDFA.Regex
        isMatch = TDFA.match compiledRegex (T.unpack name)
    if isMatch then return ()
      else fail "only alphanumeric and underscore allowed for name"
    case insert <|> update <|> delete of
      Just _  -> return ()
      Nothing -> fail "must provide operation spec(s)"
    mapM_ checkEmptyCols [insert, update, delete]
    return $ CreateEventTriggerQuery name table insert update delete retryConf webhook headers replace
    where
      checkEmptyCols spec
        = case spec of
        Just (SubscribeOpSpec (SubCArray cols) _) -> when (null cols) (fail "found empty column specification")
        Just (SubscribeOpSpec _ (Just (SubCArray cols)) ) -> when (null cols) (fail "found empty payload specification")
        _ -> return ()
  parseJSON _ = fail "expecting an object"

$(deriveToJSON (aesonDrop 4 snakeCase){omitNothingFields=True} ''CreateEventTriggerQuery)

data TriggerOpsDef
  = TriggerOpsDef
  { tdInsert :: !(Maybe SubscribeOpSpec)
  , tdUpdate :: !(Maybe SubscribeOpSpec)
  , tdDelete :: !(Maybe SubscribeOpSpec)
  } deriving (Show, Eq, Lift)

$(deriveJSON (aesonDrop 2 snakeCase){omitNothingFields=True} ''TriggerOpsDef)

data DeleteEventTriggerQuery
  = DeleteEventTriggerQuery
  { detqName :: !T.Text
  } deriving (Show, Eq, Lift)

$(deriveJSON (aesonDrop 4 snakeCase){omitNothingFields=True} ''DeleteEventTriggerQuery)

data EventTrigger
  = EventTrigger
  { etTable      :: !QualifiedTable
  , etName       :: !TriggerName
  , etDefinition :: !TriggerOpsDef
  , etWebhook    :: !T.Text
  , etRetryConf  :: !RetryConf
  }

$(deriveJSON (aesonDrop 2 snakeCase){omitNothingFields=True} ''EventTrigger)

data EventTriggerDef
  = EventTriggerDef
  { etdName       :: !TriggerName
  , etdDefinition :: !TriggerOpsDef
  , etdWebhook    :: !T.Text
  , etdRetryConf  :: !RetryConf
  , etdHeaders    :: !(Maybe [HeaderConf])
  } deriving (Show, Eq, Lift)

$(deriveJSON (aesonDrop 3 snakeCase){omitNothingFields=True} ''EventTriggerDef)

data DeliverEventQuery
  = DeliverEventQuery
  { deqEventId :: !EventId
  } deriving (Show, Eq, Lift)

$(deriveJSON (aesonDrop 3 snakeCase){omitNothingFields=True} ''DeliverEventQuery)
